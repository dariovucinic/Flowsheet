import sys
import json
import traceback
import io
import os

# Import CAD kernel if available
try:
    import cad_kernel
except ImportError:
    cad_kernel = None

def execute_code(code: str, inputs: dict = None) -> dict:
    """Execute Python code and return results."""
    # Capture stdout and stderr separately
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    # Save original streams
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    
    # Redirect
    sys.stdout = stdout_capture
    sys.stderr = stderr_capture
    
    try:
        # Create execution namespace with inputs
        namespace = {'__builtins__': __builtins__}
        if inputs:
            for k, v in inputs.items():
                # Basic sanitization for keys
                if isinstance(k, str) and k.isidentifier():
                    namespace[k] = v
        
        # Execute the code
        exec(code, namespace)
        
        # Extract outputs
        outputs = {}
        import types
        for k, v in namespace.items():
            if not k.startswith('_') and k != '__builtins__' and not callable(v) and not isinstance(v, types.ModuleType):
                try:
                    # Test serializability
                    json.dumps(v)
                    outputs[k] = v
                except (TypeError, ValueError):
                    outputs[k] = str(v)
        
        return {
            'success': True, 
            'outputs': outputs, 
            'logs': stdout_capture.getvalue(),
            'errors': stderr_capture.getvalue()
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc(),
            'logs': stdout_capture.getvalue(),
            'errors': stderr_capture.getvalue()
        }
    finally:
        # ALWAYS restore streams
        sys.stdout = original_stdout
        sys.stderr = original_stderr
        stdout_capture.close()
        stderr_capture.close()

def main():
    """Main loop: read JSON commands from stdin, write responses to stdout."""
    # Use stderr for bridge status logs to keep stdout clean for JSON
    sys.stderr.write(f"FlowSheet Python Bridge Initialized\n")
    sys.stderr.write(f"Python Version: {sys.version}\n")
    sys.stderr.write(f"Python Executable: {sys.executable}\n")
    sys.stderr.flush()
    
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
                
            input_data = line.strip()
            if not input_data:
                continue
                
            command = json.loads(input_data)
            action = command.get('action')
            req_id = command.get('_id')
            
            if action == 'ping':
                result = {'success': True, 'message': 'pong'}
            
            elif action == 'execute':
                code = command.get('code', '')
                inputs = command.get('inputs', {})
                result = execute_code(code, inputs)
            
            elif action == 'freecad_check':
                # First, try importing directly (might already be in path if using bundled python)
                try:
                    import FreeCAD
                    result = {
                        'success': True, 
                        'version': f"{FreeCAD.Version()[0]}.{FreeCAD.Version()[1]}",
                        'path': FreeCAD.getHomePath(),
                        'note': 'Imported directly'
                    }
                except ImportError:
                    # Diagnostics
                    sys.stderr.write(f"Direct import failed. Current sys.path: {sys.path}\n")
                    
                    # Try common Windows paths
                    found = False
                    common_paths = [
                        r"C:\Program Files\FreeCAD 1.0\bin",
                        r"C:\Program Files\FreeCAD 0.21\bin",
                        r"C:\Program Files\FreeCAD 1.1\bin",
                    ]
                    for path in common_paths:
                        if os.path.exists(path):
                            if path not in sys.path:
                                sys.path.append(path)
                            # On Windows, we also need the bin folder in PATH for DLLs
                            if os.name == 'nt' and path not in os.environ['PATH']:
                                os.environ['PATH'] = path + os.pathsep + os.environ['PATH']
                                
                            try:
                                import FreeCAD
                                result = {
                                    'success': True, 
                                    'version': f"{FreeCAD.Version()[0]}.{FreeCAD.Version()[1]}",
                                    'path': path,
                                    'note': 'Library loaded after adding to path'
                                }
                                found = True
                                break
                            except Exception as e:
                                sys.stderr.write(f"Found path {path} but import failed: {str(e)}\n")
                                pass
                    if not found:
                        result = {'success': False, 'error': 'FreeCAD not found. I checked common locations but FreeCAD 1.0 binary needs to be reachable.'}
                except Exception as e:
                    # Catch the "Module use of python311.dll conflicts..." here too
                    result = {'success': False, 'error': f"Direct check error: {str(e)}"}
            
            elif action == 'exit':
                break
            
            elif action.startswith('cad_') and cad_kernel:
                result = cad_kernel.process_cad_command(command)
            
            else:
                result = {'success': False, 'error': f'Unknown action: {action}'}
                
            if req_id is not None:
                result['_id'] = req_id
                
            # Send ONLY the JSON result to real stdout
            # We use sys.__stdout__ to ensure we bypass any remaining redirection
            output_json = json.dumps(result)
            sys.__stdout__.write(output_json + "\n")
            sys.__stdout__.flush()
            
        except EOFError:
            break
        except Exception as e:
            err_res = {'success': False, 'error': f'Bridge Critical: {str(e)}'}
            try:
                sys.__stdout__.write(json.dumps(err_res) + "\n")
                sys.__stdout__.flush()
            except:
                pass

if __name__ == '__main__':
    main()

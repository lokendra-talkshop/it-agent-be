import ast

class DSLInterpreter:
    def __init__(self):
        pass

    def interpret_code(self, code):
        if isinstance(code, str):
            try:
                module = ast.parse(code)
                code_functions = []
                for expr in module.body:
                    if hasattr(expr, 'value') and hasattr(expr.value, 'func') and hasattr(expr.value, 'args'):
                        function = expr.value
                        if function.func.id == 'gather_input':
                            code_functions.append({
                                'message': function.args[0].value,
                                'variable': function.args[1].value,
                                'action': 'fetch_user_data'
                            })
                return code_functions
            except Exception as e:
                print(f"Error parsing code: {e}")
                return None
        elif isinstance(code, list):
            return_code = [self.interpret_code(x) for x in code]
            return [x for x in return_code if x is not None]
        else:
            return None
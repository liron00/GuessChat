class Error(Exception):
    value = 1 
    message = 'An error occured.'
    http_status = '500'

    def __init__(self, message=None, value=None, http_status=None):
        if message:
            super().__init__(message)
        else:
            super().__init__()

        if value is not None:
            self.value = value
        if message is not None:
            self.message = message
        if http_status is not None:
            self.http_status = str(http_status)

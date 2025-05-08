Order ID: 21 - Status: preparing
"GET /customer/api/order-status/21/ HTTP/1.1" 200 23
Order ID: 21 - Status: preparing
"GET /customer/api/order-status/21/ HTTP/1.1" 200 23
Internal Server Error: /restaurants/pending-orders/
Traceback (most recent call last):
  File "C:\Users\Ryan\django-env\Lib\site-packages\django\core\handlers\exception.py", line 55, in inner
    response = get_response(request)
               ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\django\core\handlers\base.py", line 197, in _get_response
    response = wrapped_callback(request, *callback_args, **callback_kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\django\views\decorators\csrf.py", line 65, in _view_wrapper
    return view_func(request, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\django\views\generic\base.py", line 104, in view
    return self.dispatch(request, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\views.py", line 515, in dispatch
    response = self.handle_exception(exc)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\views.py", line 475, in handle_exception
    self.raise_uncaught_exception(exc)
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\views.py", line 486, in raise_uncaught_exception
    raise exc
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\views.py", line 512, in dispatch
    response = handler(request, *args, **kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\decorators.py", line 50, in handler
    return func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\soti_delivery\restaurant\views.py", line 158, in get_pending_orders
    return Response({'orders': serializer.data})
                               ^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\serializers.py", line 797, in data
    ret = super().data
          ^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\serializers.py", line 251, in data
    self._data = self.to_representation(self.instance)
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\serializers.py", line 715, in to_representation
    return [
           ^
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\serializers.py", line 716, in <listcomp>
    self.child.to_representation(item) for item in iterable
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\serializers.py", line 540, in to_representation
    ret[field.field_name] = field.to_representation(attribute)
                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Ryan\django-env\Lib\site-packages\rest_framework\fields.py", line 1870, in to_representation
    return method(value)
           ^^^^^^^^^^^^^
  File "C:\Users\Ryan\soti_delivery\restaurant\serializers.py", line 37, in get_rider_phone
    return rider.phone  # Now accessing the 'phone' attribute from the Rider model
           ^^^^^^^^^^^
AttributeError: 'User' object has no attribute 'phone'
"GET /restaurants/pending-orders/ HTTP/1.1" 500 142955
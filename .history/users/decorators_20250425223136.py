# from django.http import HttpResponseForbidden
# from django.shortcuts import redirect

# def role_required(allowed_roles=[]):
#     def decorator(view_func):
#         def wrapper(request, *args, **kwargs):
#             if not request.user.is_authenticated:
#                 return redirect('landing-page')  # or login page
#             if request.user.role not in allowed_roles:
#                 return HttpResponseForbidden("Access denied.")
#             return view_func(request, *args, **kwargs)
#         return wrapper
#     return decorator

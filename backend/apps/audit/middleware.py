import logging
from .models import AuditLog

logger = logging.getLogger(__name__)

class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log mutating actions (POST, PUT, PATCH, DELETE) or admin actions
        if request.path.startswith('/api/') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            try:
                ip = request.META.get('HTTP_X_FORWARDED_FOR')
                if ip:
                    ip = ip.split(',')[0]
                else:
                    ip = request.META.get('REMOTE_ADDR')

                user_str = request.user.username if request.user.is_authenticated else 'Anonymous'

                module_name = 'API'
                if 'leads' in request.path:
                    module_name = 'Lead Management'
                elif 'bre' in request.path:
                    module_name = 'BRE Engine'
                elif 'auth' in request.path:
                    module_name = 'Authentication'

                AuditLog.objects.create(
                    user=user_str,
                    action=request.method,
                    module=module_name,
                    path=request.path,
                    ip_address=ip,
                    status_code=response.status_code,
                    details={'query_params': dict(request.GET.items())}
                )
            except Exception as e:
                logger.error(f"Audit log creation error: {str(e)}")

        return response

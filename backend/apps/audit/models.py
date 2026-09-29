from django.db import models

class AuditLog(models.Model):
    user = models.CharField(max_length=150, default='Anonymous/System')
    action = models.CharField(max_length=50) # e.g. GET, POST, PUT, DELETE, LOGIN
    module = models.CharField(max_length=100) # e.g. Lead, BRERule, Auth
    path = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.user} - {self.action} {self.path} ({self.status_code})"

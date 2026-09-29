from django.db import models
from django.contrib.auth.models import AbstractUser

class Role(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    ADMIN = 'ADMIN', 'Admin'
    LOAN_MANAGER = 'LOAN_MANAGER', 'Loan Manager'
    SALES_EXECUTIVE = 'SALES_EXECUTIVE', 'Sales Executive'
    READ_ONLY = 'READ_ONLY', 'Read Only'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SALES_EXECUTIVE
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def is_superadmin(self):
        return self.role == Role.SUPER_ADMIN or self.is_superuser

    def is_admin_level(self):
        return self.role in [Role.SUPER_ADMIN, Role.ADMIN] or self.is_superuser

    def is_manager_level(self):
        return self.role in [Role.SUPER_ADMIN, Role.ADMIN, Role.LOAN_MANAGER] or self.is_superuser

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

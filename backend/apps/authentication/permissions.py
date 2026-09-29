from rest_framework import permissions

class IsAdminOrSuperAdmin(permissions.BasePermission):
    """
    Permission check for Admin or Super Admin role.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin_level()

class IsLoanManagerOrAbove(permissions.BasePermission):
    """
    Permission check for Loan Manager, Admin, or Super Admin.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_manager_level()

class IsReadOnlyOrAuthenticated(permissions.BasePermission):
    """
    Permission to allow read access to authenticated users, but write access only to managers.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_manager_level()

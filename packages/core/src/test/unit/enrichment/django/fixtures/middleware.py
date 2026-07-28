"""
Django Middleware Fixture

MUST detect:
- Middleware classes
- Middleware → View protection
- Request/response processing
- Authentication middleware
"""

from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# MUST detect: Middleware AuthenticationMiddleware
class CustomAuthenticationMiddleware(MiddlewareMixin):
    """
    Custom authentication middleware
    
    MUST detect: Protects all views
    """
    
    def process_request(self, request):
        """Process request before view"""
        # Check for API key in headers
        api_key = request.META.get('HTTP_X_API_KEY')
        
        if not api_key and not request.user.is_authenticated:
            # Allow unauthenticated access to public endpoints
            if request.path.startswith('/api/public/'):
                return None
            
            return JsonResponse({
                'error': 'Authentication required'
            }, status=401)
        
        return None


# MUST detect: Middleware CORSMiddleware
class CORSMiddleware(MiddlewareMixin):
    """
    CORS middleware for API requests
    
    MUST detect: Protects API views
    """
    
    def process_response(self, request, response):
        """Add CORS headers to response"""
        if request.path.startswith('/api/'):
            response['Access-Control-Allow-Origin'] = settings.CORS_ALLOWED_ORIGINS
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response


# MUST detect: Middleware LoggingMiddleware
class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log all requests and responses
    """
    
    def process_request(self, request):
        """Log incoming request"""
        logger.info(f"Request: {request.method} {request.path}")
        return None
    
    def process_response(self, request, response):
        """Log outgoing response"""
        logger.info(f"Response: {response.status_code} for {request.path}")
        return response


# MUST detect: Middleware RateLimitMiddleware
# MUST detect: Protects specific views (API endpoints)
class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware for API endpoints
    """
    
    def process_request(self, request):
        """Check rate limits"""
        if request.path.startswith('/api/'):
            # Simple rate limit logic (should use cache in production)
            user_id = request.user.id if request.user.is_authenticated else request.META.get('REMOTE_ADDR')
            
            # Check rate limit (simplified)
            # In production, use Redis or Django cache
            
        return None


# MUST detect: Middleware SecurityMiddleware
# MUST detect: Protects admin views
class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to responses
    
    MUST detect: Protects /admin/* views
    """
    
    def process_response(self, request, response):
        """Add security headers"""
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Additional headers for admin
        if request.path.startswith('/admin/'):
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response

from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model

from .serializers import SignupSerializer, LoginSerializer, UserSerializer, CompanySerializer
from .models import Company

User = get_user_model()


class SignupView(generics.CreateAPIView):
    """
    API endpoint for user registration
    """
    queryset = User.objects.all()
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    API endpoint for user login
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user_obj = User.objects.filter(email__iexact=email).first()
        if user_obj:
            user = authenticate(username=user_obj.username, password=password)
        else:
            user = None
        
        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for viewing and updating user profile
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class CompanyListView(generics.ListAPIView):
    """
    API endpoint for listing and auto-seeding standard companies
    """
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    
    def get_queryset(self):
        # Prepopulate with defaults if empty
        if Company.objects.count() == 0:
            defaults = [
                {"name": "Google", "website": "https://google.com"},
                {"name": "Stripe", "website": "https://stripe.com"},
                {"name": "Meta", "website": "https://meta.com"},
                {"name": "Amazon", "website": "https://amazon.com"},
                {"name": "Microsoft", "website": "https://microsoft.com"},
                {"name": "Netflix", "website": "https://netflix.com"},
                {"name": "Apple", "website": "https://apple.com"},
            ]
            for d in defaults:
                Company.objects.get_or_create(name=d["name"], website=d["website"])
        return Company.objects.all()

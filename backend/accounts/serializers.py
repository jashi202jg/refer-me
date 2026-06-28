import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    """
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'phone', 'company', 'bio',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class SignupSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = (
            'email', 'password', 'password2',
            'first_name', 'last_name', 'user_type',
            'phone', 'company'
        )
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def validate_user_type(self, value):
        if value not in ['referrer', 'candidate']:
            raise serializers.ValidationError(
                "User type must be either 'referrer' or 'candidate'"
            )
        return value
    
    def create(self, validated_data):
        validated_data.pop('password2')
        
        email = validated_data.get('email', '')
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        
        base = email.split('@')[0] if email else f"{first_name}{last_name}".lower()
        base_username = re.sub(r'[^a-zA-Z0-9_]', '', base) or 'user'
        
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        validated_data['username'] = username
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

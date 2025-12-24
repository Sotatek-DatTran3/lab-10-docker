from django.shortcuts import render
from django.http import JsonResponse
from django.core.cache import cache
from django.db import connection
from django.conf import settings
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime
import redis
import os

from .models import User
from .serializers import UserSerializer


@api_view(['GET'])
def health(request):
    """Health check endpoint"""
    
    # Database health check
    db_status = "Disconnected"
    db_version = None
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version()")
            db_version = cursor.fetchone()[0]
            db_status = "Connected"
    except Exception as e:
        db_version = str(e)

    # Redis health check
    redis_status = "Disconnected"
    try:
        cache.set('health_check', 'ok', 30)
        if cache.get('health_check') == 'ok':
            redis_status = "Connected"
    except Exception:
        redis_status = "Disconnected"

    return JsonResponse({
        'service': 'Python Django Backend',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'database': {
            'postgresql': db_status,
            'version': db_version,
            'redis': redis_status
        }
    })


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()[:10]  # Limit to 10 users
    serializer_class = UserSerializer


@api_view(['GET'])
def postgres_test(request):
    """Test PostgreSQL connection"""
    try:
        user_count = User.objects.count()
        with connection.cursor() as cursor:
            cursor.execute("SELECT version()")
            db_version = cursor.fetchone()[0]
        
        return JsonResponse({
            'message': 'PostgreSQL connection successful',
            'userCount': user_count,
            'version': db_version,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return JsonResponse({
            'error': 'PostgreSQL connection failed',
            'message': str(e)
        }, status=500)


@api_view(['GET'])
def redis_test(request):
    """Test Redis connection"""
    try:
        test_key = 'python-test-key'
        test_value = 'Hello from Python Django!'
        
        cache.set(test_key, test_value, 300)  # 5 minutes
        retrieved_value = cache.get(test_key)
        
        return JsonResponse({
            'message': 'Redis connection successful',
            'testValue': retrieved_value,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return JsonResponse({
            'error': 'Redis connection failed',
            'message': str(e)
        }, status=500)
from django.urls import path
from . import views

urlpatterns = [
    path('health', views.health, name='health'),
    path('api/users', views.UserListCreateView.as_view(), name='user-list-create'),
    path('api/postgres/test', views.postgres_test, name='postgres-test'),
    path('api/redis/test', views.redis_test, name='redis-test'),
]
from django.apps import AppConfig
from django.db import connection
from django.core.cache import cache
import time
import logging

logger = logging.getLogger(__name__)


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        """Initialize database and Redis connections with retry logic"""
        # Start connection retries in background (non-blocking)
        self.initialize_connections_with_retry()

    def initialize_connections_with_retry(self):
        """Retry database and Redis connections on startup"""
        import threading
        
        def retry_database_connection():
            """Retry PostgreSQL connection with exponential backoff"""
            max_retries = 5
            base_delay = 2  # 2 seconds
            
            for attempt in range(1, max_retries + 1):
                try:
                    logger.info(f'🔄 Attempting PostgreSQL connection (attempt {attempt}/{max_retries})...')
                    # Test connection
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT version()")
                        version = cursor.fetchone()[0]
                    logger.info(f'✅ PostgreSQL connected successfully: {version[:50]}...')
                    return True
                except Exception as e:
                    logger.error(f'❌ PostgreSQL connection attempt {attempt} failed: {str(e)}')
                    if attempt < max_retries:
                        delay = base_delay * (2 ** (attempt - 1))  # Exponential backoff
                        logger.info(f'⏳ Waiting {delay}s before retry...')
                        time.sleep(delay)
                    else:
                        logger.error('❌ PostgreSQL: All connection attempts failed. Will retry in background.')
                        # Continue retrying in background
                        background_retry_database()
                        return False
            return False

        def retry_redis_connection():
            """Retry Redis connection with exponential backoff"""
            max_retries = 5
            base_delay = 2  # 2 seconds
            
            for attempt in range(1, max_retries + 1):
                try:
                    logger.info(f'🔄 Attempting Redis connection (attempt {attempt}/{max_retries})...')
                    # Test connection
                    cache.set('health_check_startup', 'ok', 30)
                    if cache.get('health_check_startup') == 'ok':
                        logger.info('✅ Redis connected successfully')
                        return True
                    else:
                        raise Exception('Redis set/get test failed')
                except Exception as e:
                    logger.error(f'❌ Redis connection attempt {attempt} failed: {str(e)}')
                    if attempt < max_retries:
                        delay = base_delay * (2 ** (attempt - 1))  # Exponential backoff
                        logger.info(f'⏳ Waiting {delay}s before retry...')
                        time.sleep(delay)
                    else:
                        logger.error('❌ Redis: All connection attempts failed. Will retry in background.')
                        # Continue retrying in background
                        background_retry_redis()
                        return False
            return False

        def background_retry_database():
            """Background retry for PostgreSQL connection"""
            retry_interval = 10  # Retry every 10 seconds
            while True:
                try:
                    time.sleep(retry_interval)
                    logger.info('🔄 Retrying PostgreSQL connection in background...')
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT version()")
                    logger.info('✅ PostgreSQL connected successfully (background retry)')
                    break  # Exit loop on success
                except Exception as e:
                    logger.error(f'❌ PostgreSQL background retry failed: {str(e)}')

        def background_retry_redis():
            """Background retry for Redis connection"""
            retry_interval = 10  # Retry every 10 seconds
            while True:
                try:
                    time.sleep(retry_interval)
                    logger.info('🔄 Retrying Redis connection in background...')
                    cache.set('health_check_background', 'ok', 30)
                    if cache.get('health_check_background') == 'ok':
                        logger.info('✅ Redis connected successfully (background retry)')
                        break  # Exit loop on success
                except Exception as e:
                    logger.error(f'❌ Redis background retry failed: {str(e)}')

        # Start retry threads (non-blocking)
        db_thread = threading.Thread(target=retry_database_connection, daemon=True)
        redis_thread = threading.Thread(target=retry_redis_connection, daemon=True)
        
        db_thread.start()
        redis_thread.start()
        
        logger.info('🚀 Started database and Redis connection retry threads')
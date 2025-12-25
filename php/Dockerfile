# Build stage - install extensions
FROM php:8.2-cli-alpine AS builder

# Install build dependencies
RUN apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    libpng-dev \
    libxml2-dev

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mysqli gd xml

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Clean up build dependencies
RUN apk del .build-deps


# Production stage
FROM php:8.2-cli-alpine AS production
WORKDIR /var/www/html

# Install only runtime dependencies
RUN apk add --no-cache \
    libpng \
    libxml2

# Copy PHP extensions from builder
COPY --from=builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=builder /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/

# Copy composer from official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy composer files and install
COPY composer.json ./
RUN composer install --no-dev --optimize-autoloader --no-scripts && \
    rm -rf /root/.composer

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S php && adduser -u 1001 -S php -G php && \
    chown -R php:php /var/www/html

USER php

EXPOSE 80

CMD ["php", "-S", "0.0.0.0:80", "-t", "/var/www/html"]

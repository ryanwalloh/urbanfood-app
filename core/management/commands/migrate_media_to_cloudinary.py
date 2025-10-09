import os
import cloudinary
import cloudinary.uploader
from django.core.management.base import BaseCommand
from django.conf import settings
from restaurant.models import Restaurant
from menu.models import Product


class Command(BaseCommand):
    help = 'Migrate existing media files to Cloudinary'

    def handle(self, *args, **options):
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
            api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
            api_secret=settings.CLOUDINARY_STORAGE['API_SECRET']
        )

        self.stdout.write(self.style.SUCCESS('Starting media migration to Cloudinary...'))
        
        # Migrate Restaurant Profile Pictures
        self.stdout.write('\n[IMAGES] Migrating restaurant profile pictures...')
        restaurants = Restaurant.objects.filter(profile_picture__isnull=False).exclude(profile_picture='')
        
        for restaurant in restaurants:
            try:
                old_path = restaurant.profile_picture.name
                if not old_path:
                    continue
                    
                local_file_path = os.path.join(settings.MEDIA_ROOT, old_path)
                
                if os.path.exists(local_file_path):
                    # Upload to Cloudinary
                    result = cloudinary.uploader.upload(
                        local_file_path,
                        folder='restaurant_profiles',
                        use_filename=True,
                        unique_filename=False
                    )
                    
                    # Update database with Cloudinary URL path (relative)
                    restaurant.profile_picture = f"restaurant_profiles/{os.path.basename(old_path)}"
                    restaurant.save()
                    
                    self.stdout.write(self.style.SUCCESS(f'  [OK] {restaurant.name}: {old_path}'))
                else:
                    self.stdout.write(self.style.WARNING(f'  [WARN] File not found: {local_file_path}'))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  [ERROR] Error with {restaurant.name}: {str(e)}'))

        # Migrate Product Pictures
        self.stdout.write('\n[PRODUCTS] Migrating product pictures...')
        products = Product.objects.filter(product_picture__isnull=False).exclude(product_picture='')
        
        for product in products:
            try:
                old_path = product.product_picture.name
                if not old_path:
                    continue
                    
                local_file_path = os.path.join(settings.MEDIA_ROOT, old_path)
                
                if os.path.exists(local_file_path):
                    # Upload to Cloudinary
                    result = cloudinary.uploader.upload(
                        local_file_path,
                        folder='restaurant_products',
                        use_filename=True,
                        unique_filename=False
                    )
                    
                    # Update database with Cloudinary URL path (relative)
                    product.product_picture = f"restaurant_products/{os.path.basename(old_path)}"
                    product.save()
                    
                    self.stdout.write(self.style.SUCCESS(f'  [OK] {product.name}: {old_path}'))
                else:
                    self.stdout.write(self.style.WARNING(f'  [WARN] File not found: {local_file_path}'))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  [ERROR] Error with {product.name}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS('\n[DONE] Migration complete!'))
        self.stdout.write(self.style.SUCCESS(f'[OK] Restaurants migrated: {restaurants.count()}'))
        self.stdout.write(self.style.SUCCESS(f'[OK] Products migrated: {products.count()}'))


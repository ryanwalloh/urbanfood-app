from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Set hashed passwords for restaurant users'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting restaurant passwords...'))
        
        restaurants = [
            {'email': 'altitudecafe@gmail.com', 'password': 'password123'},
            {'email': 'thefarmgrill@gmail.com', 'password': 'password123'},
            {'email': 'blooperscafe@gmail.com', 'password': 'password123'},
            {'email': 'binolawankape@gmail.com', 'password': 'password123'},
        ]
        
        for rest in restaurants:
            try:
                user = User.objects.get(email=rest['email'])
                user.set_password(rest['password'])  # This hashes the password
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  [OK] {user.username}: Password set'))
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  [WARN] {rest["email"]}: User not found'))
        
        self.stdout.write(self.style.SUCCESS('[DONE] All passwords updated!'))


import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const referrerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn && authService.isReferrer) {
    return true;
  }

  // Redirect to dashboard if not referrer
  router.navigate(['/dashboard']);
  return false;
};

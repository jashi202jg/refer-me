import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const candidateGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn && authService.isCandidate) {
    return true;
  }

  // Redirect to dashboard if not candidate
  router.navigate(['/dashboard']);
  return false;
};

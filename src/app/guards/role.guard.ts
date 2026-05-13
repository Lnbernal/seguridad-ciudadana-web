import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const user = auth.getUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data?.['roles'] as string[] || [];

  if (allowedRoles.length === 0) {
    return true;
  }

  if (allowedRoles.includes(user.rol)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
/**
 * Centralized Role-Based Access Control and Route Resolution for Al-Shafay Hospital Fatehpur
 */

export function getAuthorizedPathForRole(role) {
  const r = (role || '').toLowerCase();
  switch (r) {
    case 'receptionist': 
      return '/reception';
    case 'doctor': 
      return '/doctor';
    case 'lab_tech': 
      return '/lab';
    case 'pharmacist': 
      return '/pharmacy';
    case 'super_admin':
    case 'admin': 
      return '/admin';
    default: 
      return '/';
  }
}

export function isRouteAllowedForRole(role, pathname) {
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/unauthorized') {
    return false;
  }
  const r = (role || '').toLowerCase();
  if (r === 'super_admin' || r === 'admin') return true;

  if (pathname.startsWith('/reception') && r === 'receptionist') return true;
  if (pathname.startsWith('/doctor') && r === 'doctor') return true;
  if (pathname.startsWith('/lab') && r === 'lab_tech') return true;
  if (pathname.startsWith('/pharmacy') && r === 'pharmacist') return true;

  return false;
}

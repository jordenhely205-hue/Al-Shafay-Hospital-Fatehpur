/**
 * Centralized Role-Based Access Control and Route Resolution for Al-Shafay Hospital Fatehpur
 */

export function getAuthorizedPathForRole(role) {
  const r = (role || '').toLowerCase().trim();
  switch (r) {
    case 'receptionist': 
      return '/reception';
    case 'doctor': 
      return '/doctor';
    case 'lab_tech': 
    case 'lab':
      return '/lab';
    case 'pharmacist': 
    case 'pharmacy':
      return '/pharmacy';
    case 'super_admin':
    case 'admin': 
      return '/admin';
    default: 
      return '/';
  }
}

export function isRouteAllowedForRole(role, pathname) {
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/unauthorized' || pathname === '/screen' || pathname === '/book' || pathname === '/track') {
    return true;
  }
  const r = (role || '').toLowerCase().trim();
  if (r === 'super_admin' || r === 'admin') return true;

  if (pathname.startsWith('/reception') && r === 'receptionist') return true;
  if (pathname.startsWith('/doctor') && r === 'doctor') return true;
  if (pathname.startsWith('/lab') && (r === 'lab_tech' || r === 'lab')) return true;
  if (pathname.startsWith('/pharmacy') && (r === 'pharmacist' || r === 'pharmacy')) return true;
  if (pathname.startsWith('/admin') && (r === 'super_admin' || r === 'admin')) return true;

  return false;
}


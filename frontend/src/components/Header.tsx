import { useAuth } from '../contexts/AuthContext';
import OrganizationSwitcher from './OrganizationSwitcher';
import { LogOut, User } from 'lucide-react';

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace Sync Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your Amazon & Walmart listings</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Organization Switcher */}
          <OrganizationSwitcher />

          {/* User Menu */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
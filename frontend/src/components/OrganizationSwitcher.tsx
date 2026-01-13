import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, ChevronDown, Check } from 'lucide-react';

function OrganizationSwitcher() {
  const { organization, organizations, switchOrganization } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!organization || organizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
        <Building2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {organization?.name || 'No Organization'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Building2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{organization.name}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 border border-gray-200 py-2">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Switch Organization</p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    if (org.slug !== organization.slug) {
                      switchOrganization(org.slug);
                    }
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    org.id === organization.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {org.role && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                          {org.role}
                        </span>
                      )}
                    </p>
                  </div>
                  {org.id === organization.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default OrganizationSwitcher;
import React, { useState, useEffect } from "react";
import type { ClientFormData } from "../../types/client";
import {
  getProvinces,
  getCitiesForProvince,
} from "../../data/philippineLocations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FiAlertCircle } from "react-icons/fi";

interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<ClientFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Philippines",
    id_type: "",
    id_number: "",
    status: "active",
    ...initialData,
  });

  // Get available provinces and cities
  const provinces = getProvinces();
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Update available cities when province changes
  useEffect(() => {
    if (formData.state) {
      setAvailableCities(getCitiesForProvince(formData.state));
    } else {
      setAvailableCities([]);
    }
  }, [formData.state]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Update form when initialData changes (for editing)
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6 custom-scrollbar">
      {/* Form Header */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold">
          {initialData && Object.keys(initialData).length > 0
            ? "Edit Client Information"
            : "New Client Information"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Fill in the client details below. Fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 custom-scrollbar">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold">Personal Information</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={
                  errors.first_name
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
                disabled={isSubmitting}
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <FiAlertCircle className="h-4 w-4" />
                  {errors.first_name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={
                  errors.last_name
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
                disabled={isSubmitting}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <FiAlertCircle className="h-4 w-4" />
                  {errors.last_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold">Contact Information</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
                disabled={isSubmitting}
                placeholder="Enter email address"
              />
              {errors.email && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <FiAlertCircle className="h-4 w-4" />
                  {errors.email}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Phone Number</label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Enter phone number"
              />
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold">Address Information</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">
                Street Address
              </label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block">Province</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Province</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">City</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={isSubmitting || !formData.state}
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select City</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {!formData.state && (
                  <p className="text-xs text-gray-500">
                    Select a province first
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block">Postal Code</label>
                <Input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Enter postal code"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Country</label>
                <Input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Identification & Status Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold">Identification & Status</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">ID Type</label>
              <select
                name="id_type"
                value={formData.id_type}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select ID Type</option>
                <option value="SSS ID">SSS ID</option>
                <option value="UMID">UMID</option>
                <option value="Driver's License">Driver's License</option>
                <option value="Passport">Passport</option>
                <option value="PhilHealth ID">PhilHealth ID</option>
                <option value="Postal ID">Postal ID</option>
                <option value="Voter's ID">Voter's ID</option>
                <option value="PRC ID">PRC ID</option>
                <option value="National ID">Philippine National ID</option>
                <option value="TIN ID">TIN ID</option>
                <option value="Pag-IBIG ID">Pag-IBIG ID</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">ID Number</label>
              <Input
                type="text"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Enter ID number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Client"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;

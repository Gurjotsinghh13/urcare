import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRoleBadgeColor(role?: string) {
  switch (role) {
    case 'admin':
      return 'bg-[#FCEEF1] text-[#202124] border-[#EAE3E5]';
    case 'doctor':
      return 'bg-[#FDF2F0] text-[#D97660] border-[#F4C7D3]';
    case 'nurse':
      return 'bg-[#F0F7F4] text-[#27805B] border-[#D1E7DD]';
    case 'manager':
      return 'bg-[#FDF8F0] text-[#B7791F] border-[#F3E5D0]';
    default:
      return 'bg-[#FAF8F8] text-[#6B7280] border-[#EAE3E5]';
  }
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'admitted':
      return { label: 'In Bed', color: 'bg-[#FAF8F8] text-[#202124] border-[#EAE3E5]' };
    case 'discharge_eligible':
      return { label: 'Eligible (3d)', color: 'bg-[#FDF8F0] text-[#B7791F] border-[#F3E5D0]' };
    case 'discharge_approved':
      return { label: 'Approved', color: 'bg-[#FDF2F0] text-[#D97660] border-[#F4C7D3]' };
    case 'discharged':
      return { label: 'Discharged', color: 'bg-[#F0F7F4] text-[#27805B] border-[#D1E7DD]' };
    case 'deceased':
      return { label: 'Deceased', color: 'bg-[#FDF2F2] text-[#C04444] border-[#F8D7DA]' };
    default:
      return { label: status, color: 'bg-[#FAF8F8] text-[#6B7280] border-[#EAE3E5]' };
  }
}

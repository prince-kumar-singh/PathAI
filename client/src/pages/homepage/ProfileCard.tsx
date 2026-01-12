import React from 'react';

// Define Props Interface
interface ProfileCardProps {
  name: string;
  description: string;
  colorScheme: 'blue-green' | 'green-blue'; // Match your logo design
  imageUrl: string;
}

// ProfileCard Component with Hover Effect and Logo-Themed Colors
function ProfileCard({ name, description, colorScheme, imageUrl }: ProfileCardProps) {
  const gradientClass =
    colorScheme === 'blue-green'
      ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-green-500'
      : 'bg-gradient-to-br from-green-500 via-blue-600 to-blue-500';

  return (
    <div
      className={`${gradientClass} p-6 rounded-2xl shadow-lg border border-gray-200 
                  transition-transform duration-300 ease-in-out 
                  transform hover:scale-105 hover:-translate-y-2 backdrop-blur-sm`}
    >
      <div className="flex flex-col items-center text-center bg-white/70 rounded-xl p-4">
        {/* Profile Image */}
        <img
          src={imageUrl}
          alt={name}
          className="w-[150px] h-[150px] rounded-full mb-4 object-cover shadow-md"
        />
        <h3 className="text-xl font-bold text-gray-800 mb-2">{name}</h3>
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  );
}

export default ProfileCard;

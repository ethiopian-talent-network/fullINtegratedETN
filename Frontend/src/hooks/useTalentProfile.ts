import { useState, useEffect } from 'react';
import { getTalentProfile } from '../api/profile/profileApi';

interface TalentProfile {
  name: string;
  skills: string[];
  experience: string;
  education: string;
  about: string;
  location: string;
}

interface UseTalentProfileReturn {
  profile: TalentProfile | null;
  loading: boolean;
  error: string | null;
}

export const useTalentProfile = (): UseTalentProfileReturn => {
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const profileData = await getTalentProfile();
        
        // Transform the profile data to match our interface
        const transformedProfile: TalentProfile = {
          name: profileData.name || 'Talent',
          skills: Array.isArray(profileData.skills) 
            ? profileData.skills 
            : typeof profileData.skills === 'string' 
              ? profileData.skills.split(',').map(s => s.trim()).filter(Boolean)
              : [],
          experience: profileData.experience || 'Entry level',
          education: profileData.education || 'Not specified',
          about: profileData.about || 'Passionate professional seeking new opportunities',
          location: profileData.Location || profileData.location || 'Ethiopia'
        };
        
        setProfile(transformedProfile);
      } catch (err: any) {
        console.error('Error fetching talent profile:', err);
        setError(err.message || 'Failed to load profile');
        
        // Provide a fallback profile so AI can still work
        setProfile({
          name: 'Talent',
          skills: ['Communication', 'Problem Solving', 'Teamwork'],
          experience: 'Entry level',
          education: 'Not specified',
          about: 'Passionate professional seeking new opportunities',
          location: 'Ethiopia'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};
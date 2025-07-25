
import * as React from 'react';
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContentFeed } from '@/hooks/useContentFeed';
import { useUserRole } from '@/hooks/useUserRole';
// Utility imports
import { isValidMedia } from '@/utils/feed/mediaUtils';
import { isProfileImageChanged } from '@/utils/feed/profileUtils';
import { isNewJoiner } from '@/utils/feed/joinerUtils';
import { FeedItem, Profile } from './types/feedTypes';
import NormalFeedList from './NormalFeedList';
import FeedFilters, { SortOption, FilterOption, LocationOption } from './FeedFilters';

interface FeedContentProps {
  feedItems: FeedItem[];
  likedItems: Set<string>;
  isSubscribed: boolean;
  onLike: (itemId: string, profileId: string) => void;
  onContact: (profile: Profile) => void;
  onRefresh?: () => void;
  engagementTracker?: any;
  onVideoViewing?: (viewing: boolean) => void;
}

const FeedContent = ({
  feedItems,
  likedItems,
  isSubscribed,
  onLike,
  onContact,
  onRefresh,
  engagementTracker,
  onVideoViewing
}: FeedContentProps) => {
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [locationOption, setLocationOption] = useState<LocationOption>('all');
  const { contentFeedItems } = useContentFeed();
  const { user } = useAuth();
  const { role } = useUserRole();

  const adminRoles = ["admin", "superadmin"];

  // Optimized feed processing with memoization - INTEGRATE admin content directly
  const processedFeedData = useMemo(() => {
    console.log('🚀 Processing feed data - integrating admin content smoothly');
    
    // Enrich feed items with role/joinDate for easier checks
    const enrichedFeedItems = feedItems.map(item => ({
      ...item,
      profile: {
        ...item.profile,
        role: item.profile.role || item.profile.userType,
        joinDate: item.profile.joinDate
      }
    }));

    // Convert content feed items to FeedItem type compatible format
    const contentAsRegularFeed = contentFeedItems.filter(
      c => !!c && !!c.id && isValidMedia(c.postImage)
    ).map(item => ({
      ...item,
      isContent: true,
      // Add location metadata for filtering
      locationMetadata: {
        target_locations: item.category === 'soweto' ? ['soweto'] :
                         item.category === 'jhb-central' ? ['jhb-central'] :
                         item.category === 'pta' ? ['pta'] : ['all'],
        location_specific: item.category !== 'all'
      },
      // Ensure the profile matches FeedItem's Profile type
      profile: {
        ...item.profile,
        userType: item.profile.userType as "user" | "service_provider" | "admin" | "superadmin"
      }
    } as FeedItem & { isContent: true; locationMetadata: any }));

    // Admin posts from database
    const adminPosts = enrichedFeedItems.filter(item =>
      adminRoles.includes(String(item.profile.role).toLowerCase()) &&
      ((item.type === 'post' && isValidMedia(item.postImage)) ||
        (item.type === 'profile' && isProfileImageChanged(item.profile.image)))
    );

    // ALL feed items combined for smooth display - NO SEPARATE CAROUSEL
    const allFeedItems = [
      ...contentAsRegularFeed, // Admin content feed
      ...adminPosts, // Admin posts from database
      ...enrichedFeedItems.filter(item => {
        // Skip admin posts since we already included them above
        if (adminRoles.includes(String(item.profile.role).toLowerCase())) {
          return false;
        }
        
        const hasMedia = (item.profile.posts && item.profile.posts.some(isValidMedia)) || 
                        (item.type === 'post' && isValidMedia(item.postImage));
        const imgChanged = isProfileImageChanged(item.profile.image);
        const newJoiner = isNewJoiner(item.profile.joinDate);
        
        return hasMedia || imgChanged || newJoiner;
      }).map(item => ({
        ...item,
        isWelcome: isNewJoiner(item.profile.joinDate) && 
                   (!item.profile.posts || item.profile.posts.length === 0) && 
                   !isProfileImageChanged(item.profile.image)
      }))
    ];

    return { allFeedItems };
  }, [feedItems, contentFeedItems, adminRoles]);

  // Enhanced location filtering with admin content support
  const filterByLocation = useMemo(() => {
    return (items: any[]) => {
      if (locationOption === 'all') return items;
      
      return items.filter(item => {
        // Check if item has location metadata from upload (for admin content)
        if (item.locationMetadata?.target_locations) {
          return item.locationMetadata.target_locations.includes(locationOption) ||
                 item.locationMetadata.target_locations.includes('all');
        }
        
        // Check admin content category-based location
        if (item.isContent && item.category) {
          return item.category === locationOption || item.category === 'all';
        }
        
        // Optimized profile location matching
        const location = item.profile?.location?.toLowerCase() || '';
        switch (locationOption) {
          case 'soweto':
            return location.includes('soweto');
          case 'jhb-central':
            return location.includes('johannesburg') || location.includes('jhb') || location.includes('central');
          case 'pta':
            return location.includes('pretoria') || location.includes('pta');
          default:
            return true;
        }
      });
    };
  }, [locationOption]);

  // Optimized sorting with performance improvements
  const sortFeedItems = useMemo(() => {
    return (items: any[]) => {
      switch (sortOption) {
        case 'oldest':
          return [...items].sort((a, b) => 
            new Date(a.createdAt || a.timestamp || 0).getTime() - 
            new Date(b.createdAt || b.timestamp || 0).getTime()
          );
        case 'popular':
          return [...items].sort((a, b) => 
            (b.likes?.length || 0) - (a.likes?.length || 0)
          );
        case 'newest':
        default:
          return [...items].sort((a, b) => 
            new Date(b.createdAt || b.timestamp || 0).getTime() - 
            new Date(a.createdAt || a.timestamp || 0).getTime()
          );
      }
    };
  }, [sortOption]);

  // Enhanced filtering logic with admin content support
  const filterFeedItems = useMemo(() => {
    return (items: any[]) => {
      switch (filterOption) {
        case 'posts':
          return items.filter(item => item.type === 'post');
        case 'profiles':
          return items.filter(item => item.type === 'profile');
        case 'welcome':
          return items.filter(item => item.isWelcome);
        case 'admin':
          return items.filter(item => item.isContent || adminRoles.includes(String(item.profile.role).toLowerCase()));
        case 'all':
        default:
          return items;
      }
    };
  }, [filterOption, adminRoles]);

  // Apply all filters with performance optimization
  const processedFeedItems = useMemo(() => {
    console.log('🚀 Applying filters with smooth integration');
    return sortFeedItems(filterFeedItems(filterByLocation(processedFeedData.allFeedItems)));
  }, [processedFeedData.allFeedItems, filterByLocation, filterFeedItems, sortFeedItems]);

  console.log('🚀 Smooth feed processing complete:', {
    total: processedFeedItems.length,
    location: locationOption,
    filter: filterOption,
    sort: sortOption
  });

  return (
    <div className="space-y-6 pb-6" role="list" aria-label="Social feed items">
      <FeedFilters 
        currentSort={sortOption}
        currentFilter={filterOption}
        currentLocation={locationOption}
        onSortChange={setSortOption}
        onFilterChange={setFilterOption}
        onLocationChange={setLocationOption}
      />
      
      <NormalFeedList
        userFeed={processedFeedItems}
        likedItems={likedItems}
        isSubscribed={isSubscribed}
        onLike={onLike}
        onContact={onContact}
        onVideoViewing={onVideoViewing}
      />
    </div>
  );
};

export default FeedContent;

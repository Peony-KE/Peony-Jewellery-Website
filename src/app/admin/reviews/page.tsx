'use client';

import React, { useState, useEffect } from 'react';
import { Search, Star, Trash2, Eye, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Review } from '@/types/database';

interface ReviewWithProduct extends Review {
  products?: {
    name: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewWithProduct | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    let filtered = reviews;

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.review_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.title && r.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (ratingFilter !== 'all') {
      filtered = filtered.filter((r) => r.rating === parseInt(ratingFilter));
    }

    setFilteredReviews(filtered);
  }, [reviews, searchQuery, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      setReviews(reviews.filter((r) => r.id !== id));
      setDeleteConfirm(null);
      if (selectedReview?.id === id) {
        setSelectedReview(null);
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f8dae2]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#fcfbf9]">Product Reviews</h1>
        <p className="text-[#f8dae2]">
          Manage customer reviews
          {reviews.length > 0 && (
            <span className="ml-2">
              · Average rating: {averageRating.toFixed(1)} / 5
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#5a002d] rounded-xl shadow-sm border border-[#920b4c] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#f8dae2]" size={20} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#4d0025] border border-[#920b4c] rounded-lg focus:ring-2 focus:ring-[#f8dae2] focus:border-transparent text-[#fcfbf9] placeholder-[#f8dae2]/50"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 bg-[#4d0025] border border-[#920b4c] rounded-lg focus:ring-2 focus:ring-[#f8dae2] focus:border-transparent text-[#fcfbf9]"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-[#5a002d] rounded-xl shadow-sm border border-[#920b4c] overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="mx-auto mb-4 text-[#920b4c]" size={48} />
            <h3 className="text-lg font-medium text-[#fcfbf9] mb-2">No reviews found</h3>
            <p className="text-[#f8dae2]">
              {reviews.length === 0
                ? 'Customer reviews will appear here.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#4d0025] border-b border-[#920b4c]">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#f8dae2] uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#f8dae2] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#f8dae2] uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#f8dae2] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-[#f8dae2] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#920b4c]">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-[#920b4c]/20">
                    <td className="px-6 py-4">
                      <p className="text-[#fcfbf9] font-medium">
                        {review.products?.name || 'Unknown Product'}
                      </p>
                      {review.title && (
                        <p className="text-sm text-[#f8dae2] truncate max-w-xs">
                          &quot;{review.title}&quot;
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#fcfbf9]">{review.customer_name}</p>
                      <p className="text-sm text-[#f8dae2]">{review.customer_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#f8dae2]">
                        {formatDate(review.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="p-2 text-[#f8dae2] hover:text-[#fcfbf9] hover:bg-[#920b4c]/50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                        {deleteConfirm === review.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 text-sm bg-[#920b4c] text-[#fcfbf9] rounded hover:bg-[#a80d58]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(review.id)}
                            className="p-2 text-[#f8dae2] hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-[#f8dae2]">
        Showing {filteredReviews.length} of {reviews.length} reviews
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#5a002d] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#920b4c]">
            <div className="p-6 border-b border-[#920b4c] flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#fcfbf9]">
                  Review for {selectedReview.products?.name || 'Unknown Product'}
                </h2>
                <p className="text-sm text-[#f8dae2] mt-1">
                  {formatDate(selectedReview.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-2 hover:bg-[#920b4c]/50 rounded-lg text-[#f8dae2]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Rating */}
              <div>
                <h3 className="text-sm font-medium text-[#f8dae2] mb-2">Rating</h3>
                <div className="flex items-center space-x-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-[#fcfbf9] font-medium">{selectedReview.rating} / 5</span>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-medium text-[#f8dae2] mb-2">Customer</h3>
                <div className="bg-[#4d0025] rounded-lg p-4">
                  <p className="font-medium text-[#fcfbf9]">{selectedReview.customer_name}</p>
                  <p className="text-sm text-[#f8dae2]">{selectedReview.customer_email}</p>
                  {selectedReview.verified_purchase && (
                    <span className="inline-block mt-2 text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded-full">
                      Verified Purchase
                    </span>
                  )}
                </div>
              </div>

              {/* Review Content */}
              <div>
                <h3 className="text-sm font-medium text-[#f8dae2] mb-2">Review</h3>
                <div className="bg-[#4d0025] rounded-lg p-4">
                  {selectedReview.title && (
                    <p className="font-semibold text-[#fcfbf9] mb-2">&quot;{selectedReview.title}&quot;</p>
                  )}
                  <p className="text-[#f8dae2] whitespace-pre-wrap">{selectedReview.review_text}</p>
                </div>
              </div>

              {/* Delete Action */}
              <div className="pt-4 border-t border-[#920b4c]">
                <button
                  onClick={() => {
                    handleDelete(selectedReview.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 size={18} />
                  <span>Delete Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

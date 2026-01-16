'use server';

import { createClient } from '@/lib/supabase/server';
import { OrderInsert, ContactMessageInsert, NewsletterSubscriberInsert, ReviewInsert, Review } from '@/types/database';

export async function createOrder(orderData: OrderInsert) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

export async function createContactMessage(messageData: ContactMessageInsert) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([messageData])
      .select()
      .single();

    if (error) {
      console.error('Error creating contact message:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating contact message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export async function subscribeToNewsletter(subscriberData: NewsletterSubscriberInsert) {
  try {
    const supabase = await createClient();
    
    // Check if email already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', subscriberData.email)
      .single();

    if (existing) {
      // If already subscribed and active
      if (existing.is_active) {
        return { success: false, error: 'Email is already subscribed' };
      }
      // Reactivate if previously unsubscribed
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: true })
        .eq('id', existing.id);
      
      if (error) {
        console.error('Error reactivating subscription:', error);
        return { success: false, error: error.message };
      }
      return { success: true, message: 'Subscription reactivated' };
    }

    // New subscription
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([subscriberData])
      .select()
      .single();

    if (error) {
      console.error('Error subscribing to newsletter:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return { success: false, error: 'Failed to subscribe' };
  }
}

export async function createReview(reviewData: ReviewInsert) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating review:', error);
    return { success: false, error: 'Failed to submit review' };
  }
}

export async function getProductReviews(productId: string): Promise<{ success: boolean; data?: Review[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { success: false, error: 'Failed to fetch reviews' };
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
  notification_type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  public notifications$: Observable<NotificationItem[]> = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  private pollSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.startPolling();
      } else {
        this.stopPolling();
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  startPolling() {
    if (this.pollSubscription) return;
    this.fetchNotifications();
    this.pollSubscription = timer(10000, 10000).subscribe(() => {
      this.fetchNotifications();
    });
  }

  stopPolling() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = null;
    }
  }

  fetchNotifications() {
    if (!this.authService.isLoggedIn) return;
    
    this.http.get<any>(`${this.apiUrl}/`).subscribe({
      next: (response) => {
        const rawData = Array.isArray(response) ? response : (response?.results || []);
        const list: NotificationItem[] = rawData.map((item: any) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          timestamp: new Date(item.created_at),
          isRead: item.is_read,
          link: item.link,
          notification_type: item.notification_type
        }));
        this.notificationsSubject.next(list);
        const unread = list.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unread);
      },
      error: (err) => console.error('Error fetching notifications:', err)
    });
  }

  markAsRead(id: number) {
    this.http.patch(`${this.apiUrl}/${id}/read/`, {}).subscribe({
      next: () => {
        this.fetchNotifications();
      },
      error: (err) => console.error('Error marking notification read:', err)
    });
  }

  markAllAsRead() {
    this.http.post(`${this.apiUrl}/mark-all-read/`, {}).subscribe({
      next: () => {
        this.fetchNotifications();
      },
      error: (err) => console.error('Error marking all notifications read:', err)
    });
  }

  clearAll() {
    this.http.delete(`${this.apiUrl}/clear-all/`).subscribe({
      next: () => {
        this.fetchNotifications();
      },
      error: (err) => console.error('Error clearing notifications:', err)
    });
  }

  checkNewJobs(jobs: any[]) {}
  checkNewApplications(applications: any[]) {}
}

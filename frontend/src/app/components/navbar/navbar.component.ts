import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService, NotificationItem } from '../../services/notification.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  currentUser: User | null = null;
  unreadCount = 0;
  notifications: NotificationItem[] = [];
  showNotificationsDropdown = false;
  showUserMenu = false;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    public notificationService: NotificationService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.notificationService.notifications$.subscribe(list => {
      this.notifications = list;
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleNotifications() {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    if (this.showNotificationsDropdown) this.showUserMenu = false;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) this.showNotificationsDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showNotificationsDropdown = false;
      this.showUserMenu = false;
    }
  }

  onNotificationClick(notification: NotificationItem) {
    this.notificationService.markAsRead(notification.id);
    this.showNotificationsDropdown = false;
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }

  markAllRead() {
    this.notificationService.markAllAsRead();
  }

  clearNotifications() {
    this.notificationService.clearAll();
  }

  logout() {
    this.showUserMenu = false;
    this.authService.logout();
  }
}

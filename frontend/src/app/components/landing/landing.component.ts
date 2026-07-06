import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  selectedRole: 'candidate' | 'referrer' = 'candidate';
  isMenuOpen = false;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit() {
    // If the user is already logged in, redirect them to the dashboard
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }
  }

  selectRole(role: 'candidate' | 'referrer') {
    this.selectedRole = role;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  scrollTo(elementId: string, event: Event) {
    event.preventDefault();
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getStarted() {
    this.router.navigate(['/signup'], { queryParams: { type: this.selectedRole } });
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ModalOptions {
  title: string;
  message: string;
  type?: 'confirm' | 'alert' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

export interface ModalState extends ModalOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalStateSubject = new BehaviorSubject<ModalState | null>(null);
  public modalState$: Observable<ModalState | null> = this.modalStateSubject.asObservable();

  confirm(title: string, message: string, options: Partial<ModalOptions> = {}): Promise<boolean> {
    return new Promise((resolve) => {
      this.modalStateSubject.next({
        title,
        message,
        type: options.type || 'confirm',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        isOpen: true,
        resolve
      });
    });
  }

  danger(title: string, message: string, confirmText: string = 'Delete'): Promise<boolean> {
    return this.confirm(title, message, { type: 'danger', confirmText });
  }

  alert(title: string, message: string, confirmText: string = 'OK'): Promise<boolean> {
    return new Promise((resolve) => {
      this.modalStateSubject.next({
        title,
        message,
        type: 'alert',
        confirmText,
        isOpen: true,
        resolve
      });
    });
  }

  close(result: boolean): void {
    const currentState = this.modalStateSubject.value;
    if (currentState && currentState.resolve) {
      currentState.resolve(result);
    }
    this.modalStateSubject.next(null);
  }
}

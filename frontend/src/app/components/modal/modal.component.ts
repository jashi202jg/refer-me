import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, ModalState } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  modalState: ModalState | null = null;

  constructor(public modalService: ModalService) {
    this.modalService.modalState$.subscribe(state => {
      this.modalState = state;
    });
  }

  onConfirm() {
    this.modalService.close(true);
  }

  onCancel() {
    this.modalService.close(false);
  }
}

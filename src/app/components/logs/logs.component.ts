// src/app/components/logs/logs.component.ts
import { Component, OnInit } from '@angular/core';
import { LogsService, Log } from '../../services/logs.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-logs',
  standalone:false,
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {
  logs: Log[] = [];
  loading = true;
  actionFilter: string = '';

  constructor(
    private logsService: LogsService,
    private toastService: ToastService
  ) {}
  ngOnInit(): void {
    this.fetchLogs();
  }

  fetchLogs(): void {
    this.loading = true;
    
    console.log('🔍 Filter value:', this.actionFilter);
    console.log('🔍 Filter is truthy?', !!this.actionFilter);
  
    const request$ = this.actionFilter
      ? this.logsService.getLogsByActionType(this.actionFilter)
      : this.logsService.getAllLogs();
  
    console.log('🔍 Calling:', this.actionFilter ? 'getLogsByActionType' : 'getAllLogs');
  
    request$.subscribe({
      next: (data: Log[]) => {
        console.log('✅ Received logs:', data.length);
        this.logs = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Error fetching logs:', err);
        this.toastService.showError('Failed to fetch logs.');
        this.loading = false;
      }
    });
  }
  
  deleteLog(id: string): void {
    if (!confirm('Are you sure you want to delete this log?')) return;

    this.logsService.deleteLog(id).subscribe({
      next: () => {
        this.toastService.showSuccess('Log deleted successfully.');
        this.logs = this.logs.filter(log => log._id !== id);
      },
      error: (err: any) => {
        console.error('❌ Error deleting log:', err);
        this.toastService.showError('Failed to delete log.');
      }
    });
  }

  deleteAllLogs(): void {
    if (!confirm('Are you sure you want to delete all logs?')) return;

    this.logsService.deleteAllLogs().subscribe({
      next: () => {
        this.toastService.showSuccess('All logs deleted successfully.');
        this.logs = [];
      },
      error: (err: any) => {
        console.error('❌ Error deleting all logs:', err);
        this.toastService.showError('Failed to delete all logs.');
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}

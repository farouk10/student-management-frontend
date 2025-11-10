import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LogsService, Log } from './services/logs.service';

@Injectable({
  providedIn: 'root'
})
export class LogsResolver implements Resolve<Log[]> {

  constructor(private logsService: LogsService) {}

  resolve(): Observable<Log[]> {
    // Fetch all logs before loading the component
    return this.logsService.getAllLogs().pipe(
      catchError((error) => {
        console.error('❌ LogsResolver error:', error);
        return of([]); // return an empty array on failure
      })
    );
  }
}

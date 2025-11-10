import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { EtudiantService } from './services/etudiant.service';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class etudiantResolverResolver implements Resolve<any>{


  constructor(private etudiantService: EtudiantService) { }

  resolve(route: ActivatedRouteSnapshot): Observable<any>{
    const id = Number(route.paramMap.get('id'));

    return this.etudiantService.getEtudiantById(id!);

  }

}

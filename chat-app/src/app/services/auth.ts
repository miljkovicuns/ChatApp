import {inject, Injectable} from '@angular/core';
import {RegisterRequest} from '../models/register-request';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private http = inject(HttpClient)

  private apiUrl = 'http://localhost:8080/register'

  register(user: RegisterRequest, image?: File) {
    const formData = new FormData()

    formData.append(
      'user',
      new Blob(
        [JSON.stringify(user)],
        { type: 'application/json' }
      )
    )

    if(image){
      formData.append('image',image)
    }

    return this.http.post(
      this.apiUrl,
      formData
    )

  }
}

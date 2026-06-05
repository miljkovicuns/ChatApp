import {Component, DestroyRef, Inject, inject} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Auth} from '../../services/auth';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, NgIf],
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.css',
})

export class Register {

  private fb = inject(FormBuilder)
  private authService = inject(Auth)
  private destroyRef = inject(DestroyRef)

  selectedFile?: File

  form = new FormGroup({
    firstName: new FormControl('',{nonNullable: true, validators: [Validators.required]}),
    lastName: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    username: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    phoneNumber: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    email: new FormControl('', {nonNullable: true, validators: [Validators.required]})
  })

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if(input.files?.length){
      this.selectedFile = input.files[0]
    }
  }

  register() {
    if(this.form.invalid) return

    const user = this.form.getRawValue()

    this.authService.register(user,this.selectedFile)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => console.log('Success', res),
        error: err => console.error(err)
      })
  }
}

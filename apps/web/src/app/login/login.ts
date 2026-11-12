import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { DemoApiService } from "../core/demo-api.service";

import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { CommonModule } from "@angular/common";
import { finalize } from "rxjs";


@Component({
  selector: 'login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
})

export class Login {
    private fb = inject(FormBuilder);
    private authService = inject(DemoApiService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    protected isLoading: boolean = false;

    form = this.fb.group({
        password: ['',Validators.required]
    })

    constructor() {
    }

    login() {
        this.isLoading = true;
        const val = this.form.value;
        if (val.password) {
            this.authService.login(val.password)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (data) => {
                    if (data.token != null && data.token.length > 0) {
                        this.router.navigateByUrl('/w');
                    } else {
                        this.toastr.error("Failed to authenticate");
                    }
                },
                error: (err) => {
                    if (err.status === 429) {
                        this.toastr.error("Too many attempts, please wait and try again");
                    } else {
                        this.toastr.error("Authentication Failed");
                    }
                }
            })
        }
    }
}
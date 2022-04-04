import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Enseigne, UE } from '@prisma/client';
import { Subject } from 'rxjs';
import { TeachersService } from '../teachers.service';

interface ueProps extends UE {
  Enseigne?: Enseigne[];
}
@Component({
  selector: 'teachers-archi-web-courses-details-id',
  templateUrl: './courses-details.component.html',
  styleUrls: ['./courses-details.component.scss'],
})
export class CoursesDetailsComponent implements OnInit {
  public ue: ueProps | null = null;
  public enseigne: Enseigne | null = null;

  //handle numbers of courses avaible
  public nbCMRestant: number | undefined | null = 0;
  public nbTPRestant: number | undefined | null = 0;
  public nbTDRestant: number | undefined | null = 0;

  private _isDead$ = new Subject();

  //public userId = ''
  validateForm!: FormGroup;
  isVisible = true;
  constructor(
    public teachersService: TeachersService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // this.getCourse();
    const id = this.route.snapshot.paramMap.get('id') || '';
    const obs = this.teachersService.getCourse(id);
    obs.subscribe({
      next: (x) => {
        this.ue = x;
        this.nbCMRestant =
          (x.heuresCM || 0) -
          (x.Enseigne?.reduce((x, acc) => x + (acc.heuresCM || 0), 0) || 0);
        this.nbTDRestant =
          (x.heuresTD || 0) -
          (x.Enseigne?.reduce((x, acc) => x + (acc.heuresTD || 0), 0) || 0);
        this.nbTPRestant =
          (x.heuresTP || 0) -
          (x.Enseigne?.reduce((x, acc) => x + (acc.heuresTP || 0), 0) || 0);
      },
      complete: () => {
        console.log('done', this.ue);
      },
    });
    this.getEnseignement();
    this.validateForm = this.fb.group({
      CM: [null, [Validators.required]],
      TD: [null, [Validators.required]],
      TP: [null, [Validators.required]],
    });
  }

  ngOnDestroy() {
    this._isDead$.unsubscribe();
  }
  ngAfterInit(): void {
    this.ue && console.log('dqzq', this.ue);
  }
  getCourse(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.teachersService
      .getCourse(id)
      .subscribe((ue: ueProps) => (this.ue = ue));
    console.log(this.ue);
  }

  getEnseignement(): void {
    this.teachersService
      .getEnseignementFromTeacher(this.teachersService.userValue?.id || '')
      .subscribe((enseigne: Enseigne) => (this.enseigne = enseigne));
  }
  public showModal(): void {
    this.isVisible = true;
  }
  handleCancel(): void {
    this.isVisible = false;
  }

  handleOk(): void {
    this.isVisible = false;
  }
  onSubmit(): void {
    Object.values(this.validateForm.controls).forEach((control) => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      } else {
        const formData = this.validateForm.value;
        this.teachersService
          .addEnseignement(
            this.teachersService.userValue?.id || '',
            this.ue?.id || '',
            this.teachersService.getNombreHeure(
              this.teachersService.userValue?.status || 'ATER',
              this.ue?.heuresCM || 0,
              'CM'
            ),
            this.teachersService.getNombreHeure(
              this.teachersService.userValue?.status || 'ATER',
              this.ue?.heuresTD || 0,
              'TD'
            ),
            this.teachersService.getNombreHeure(
              this.teachersService.userValue?.status || 'ATER',
              this.ue?.heuresTP || 0,
              'TP'
            ),
            parseInt(formData.CM),
            parseInt(formData.TD),
            parseInt(formData.TP)
          )
          .subscribe((response) => {
            console.log(response);
          });
        console.log('form submitted:', this.validateForm.value);

        this.isVisible = false;
        this.validateForm.reset();
      }
    });
  }
}

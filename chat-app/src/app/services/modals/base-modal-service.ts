import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  Injectable,
  Injector,
  Service,
  Type
} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class BaseModalService {
  protected modalInstance: ComponentRef<any> | null = null;
  protected closeSubject = new Subject<any>();

  constructor(
    protected appRef: ApplicationRef,
    protected injector: Injector,
    protected environmentInjector: EnvironmentInjector
  ) {}

  abstract getModalComponent(): Type<any>;

  open(data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.modalInstance = this.createModalComponent(this.getModalComponent(), data);
        this.setupEventHandlers(this.modalInstance, resolve);
      } catch (error) {
        reject(error);
      }
    });
  }

  protected createModalComponent(component: Type<any>, data?: any): ComponentRef<any> {
    const componentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
      elementInjector: this.injector
    });

    if (data) {
      Object.keys(data).forEach(key => {
        (componentRef.instance as any)[key] = data[key];
      });
    }

    this.appRef.attachView(componentRef.hostView);
    const domElement = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElement);

    return componentRef;
  }

  protected setupEventHandlers(componentRef: ComponentRef<any>, resolve: Function) {
    const instance = componentRef.instance;

    // Handle close event (from closeModal method)
    if (instance.close && typeof instance.close.subscribe === 'function') {
      instance.close.subscribe((data: any) => {
        this.close(data);
        resolve(data);
      });
    }

    // Handle confirm event (from confirmModal method)
    if (instance.confirm && typeof instance.confirm.subscribe === 'function') {
      instance.confirm.subscribe((data: any) => {
        this.close(data);
        resolve(data);
      });
    }

    // Handle passwordUpdated event
    if (instance.passwordUpdated && typeof instance.passwordUpdated.subscribe === 'function') {
      instance.passwordUpdated.subscribe((data: any) => {
        // The component will call confirmModal after emitting this
        // So we don't need to close here
        console.log('Password updated event:', data);
      });
    }
  }

  close(data?: any) {
    if (this.modalInstance) {
      this.appRef.detachView(this.modalInstance.hostView);
      this.modalInstance.destroy();
      this.modalInstance = null;
      this.closeSubject.next(data);
      this.closeSubject.complete();
    }
  }

  closeAll() {
    if (this.modalInstance) {
      this.appRef.detachView(this.modalInstance.hostView);
      this.modalInstance.destroy();
      this.modalInstance = null;
    }
  }
}

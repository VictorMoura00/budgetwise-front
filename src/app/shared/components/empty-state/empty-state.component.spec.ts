import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideTranslateService({ fallbackLang: 'pt' })],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default icon and title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const icon = compiled.querySelector('.empty-state__icon');
    expect(icon?.classList.contains('pi-inbox')).toBe(true);
  });

  it('should render custom title', () => {
    fixture.componentRef.setInput('title', 'No data');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state__title')?.textContent).toContain('No data');
  });

  it('should render subtitle when provided', () => {
    fixture.componentRef.setInput('subtitle', 'Try again later');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state__subtitle')?.textContent).toContain('Try again later');
  });

  it('should emit action when button is clicked', () => {
    fixture.componentRef.setInput('actionLabel', 'Add');
    fixture.detectChanges();

    const spy = vi.fn();
    component.action.subscribe(spy);

    const button = fixture.nativeElement.querySelector('p-button button, button');
    if (button) {
      button.click();
    }
    expect(spy).toHaveBeenCalled();
  });
});

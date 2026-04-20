import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { tarea } from '../tarea/tarea.model';
import { TareaService } from '../../servicios/tarea.service';

@Component({
  selector: 'app-editar-tarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fondo" (click)="alCancelar()"></div>
    <dialog open>
        <h2>Editar Tarea</h2>
        <form (ngSubmit)="alGuardar()">
            <p>
                <label for="titulo">Título</label>
                <input type="text" id="titulo" name="titulo" [(ngModel)]="tituloEditado" />
            </p>
            <p>
                <label for="resumen">Resumen</label>
                <textarea id="resumen" rows="4" name="resumen" [(ngModel)]="resumenEditado"></textarea>
            </p>
            <p>
                <label for="expira">Fecha Límite</label>
                <input type="date" id="expira" name="expira" [(ngModel)]="expiraEditado" />
            </p>
            <p>
                <label>Selecciona el Tema / Fondo Anime en 4K</label>
                <span class="bg-grid">
                    <span *ngFor="let bg of fondosAvanzados" 
                         class="bg-opcion" 
                         [class.seleccionado]="fondoEditado === bg.id"
                         (click)="fondoEditado = bg.id"
                         [title]="bg.nombre">
                         <img [src]="'img/' + bg.id" alt="bg">
                    </span>
                </span>
            </p>
            <p class="acciones">
                <button type="button" (click)="alCancelar()">Cancelar</button>
                <button type="submit">Guardar</button>
            </p>
        </form>
    </dialog>
  `,
  styles: [`
    /* Using exact CSS derived from nueva-tarea */
    .fondo {
        background-color: rgba(10, 5, 25, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        z-index: 10000;
    }

    dialog {
        width: 90%;
        max-width: 32rem;
        background: rgba(20, 15, 40, 0.45);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 20px;
        border: 1px solid rgba(0, 180, 216, 0.2);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 180, 216, 0.05);
        overflow: hidden;
        padding: 2rem;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #c8d6e5;
        position: fixed;
        z-index: 10001;
        animation: dialogPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes dialogPop {
        0% { opacity: 0; transform: translate(-50%, -40%) scale(0.95); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    h2 {
        margin: 0 0 1.5rem 0;
        color: #e0f2ff;
        font-size: 1.6rem;
    }

    p {
        margin: 0 0 1.2rem 0;
    }

    label {
        display: block;
        font-weight: 600;
        font-size: 0.85rem;
        color: #b8e6f0;
        margin-bottom: 0.4rem;
    }

    input, textarea {
        width: 100%;
        font: inherit;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid rgba(0, 180, 216, 0.3);
        background: rgba(10, 5, 25, 0.6);
        color: #c8e6f0;
        transition: all 0.3s ease;
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
        box-sizing: border-box;
    }

    input:focus, textarea:focus {
        outline: none;
        border-color: #00b4d8;
        box-shadow: 0 0 12px rgba(0, 180, 216, 0.4), inset 0 2px 5px rgba(0,0,0,0.5);
        background: rgba(15, 10, 35, 0.8);
    }

    .acciones {
        margin: 1.5rem 0 0;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    button {
        font: inherit;
        cursor: pointer;
        border: none;
        padding: 0.6rem 1.8rem;
        border-radius: 999px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-size: 0.85rem;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    button[type="button"] {
        background-color: transparent;
        color: #7ea8c0;
        border: 1px solid transparent;
    }

    button[type="button"]:hover, button[type="button"]:active {
        color: #ffffff;
        background-color: rgba(255, 255, 255, 0.05);
    }

    button[type="submit"] {
        background: linear-gradient(135deg, rgba(0, 180, 216, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%);
        color: #ffffff;
        box-shadow: 0 4px 15px rgba(0, 180, 216, 0.3);
        border: 1px solid rgba(0, 180, 216, 0.6);
    }

    button[type="submit"]:hover, button[type="submit"]:active {
        background: linear-gradient(135deg, rgba(0, 180, 216, 1) 0%, rgba(139, 92, 246, 1) 100%);
        box-shadow: 0 6px 20px rgba(0, 180, 216, 0.5), inset 0 0 10px rgba(255,255,255,0.2);
        transform: translateY(-2px);
    }

    .bg-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
        gap: 12px;
        margin-top: 5px;
    }

    .bg-opcion {
        height: 45px;
        border-radius: 6px;
        cursor: pointer;
        border: 2px solid transparent;
        overflow: hidden;
        transition: transform 0.2s;
    }

    .bg-opcion img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .bg-opcion:hover {
        transform: translateY(-2px);
    }

    .bg-opcion.seleccionado {
        border: 2px solid #00b4d8;
        transform: scale(1.05);
    }
  `]
})
export class EditarTarea implements OnInit {
  @Input({ required: true }) tarea!: tarea;
  @Output() cerrar = new EventEmitter<void>();

  private tareasService = inject(TareaService);

  tituloEditado = '';
  resumenEditado = '';
  expiraEditado = '';
  fondoEditado = '';

  fondosAvanzados = [
    { id: 'bg_jujutsu.png', nombre: 'Jujutsu Kaisen' },
    { id: 'bg_kimetsu.png', nombre: 'Kimetsu no Yaiba' },
    { id: 'bg_solo.png',    nombre: 'Solo Leveling' },
    { id: 'bg_tokyo.png',   nombre: 'Tokyo Ghoul' },
    { id: 'bg_onepunch.png',nombre: 'One Punch Man' },
    { id: 'bg_bleach.png',  nombre: 'Bleach Cyber' },
    { id: 'bg_toji.png',    nombre: 'Toji Zenin' },
    { id: 'bg_retro.png',   nombre: 'Cyberpunk Retro' }
  ];

  ngOnInit(): void {
      this.tituloEditado = this.tarea.titulo;
      this.resumenEditado = this.tarea.resumen;
      this.fondoEditado = this.tarea.imagenFondo || 'bg_jujutsu.png';
      
      // Formatear la fecha para un input type="date" (YYYY-MM-DD)
      if (this.tarea.expira) {
        try {
          const d = new Date(this.tarea.expira);
          this.expiraEditado = isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        } catch(e) {
          this.expiraEditado = '';
        }
      } else {
        this.expiraEditado = '';
      }
  }

  alCancelar() {
    this.cerrar.emit();
  }

  async alGuardar() {
    await this.tareasService.editarTarea(
      this.tarea.id,
      this.tituloEditado,
      this.resumenEditado,
      this.expiraEditado,
      this.fondoEditado
    );
    this.cerrar.emit();
  }
}

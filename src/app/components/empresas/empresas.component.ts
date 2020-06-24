import { Component, OnInit } from '@angular/core';
import { Empresa } from "../../models/empresa";
import { EmpresasService } from "../../services/empresas.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ModalDialogService } from "../../services/modal-dialog.service";

@Component({
  selector: 'app-empresas',
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.css']
})
export class EmpresasComponent implements OnInit {

  Titulo = "Empresas";
  TituloAccionABMC = {
    A: "(Agregar)",
    B: "(Eliminar)",
    M: "(Modificar)",
    C: "(Consultar)",
    L: "(Listado)"
  };
  AccionABMC = "L"; // inicialmente inicia en el listado de articulos (buscar con parametros)
  Mensajes = {
    SD: " No se encontraron registros...",
    RD: " Revisar los datos ingresados..."
  };
  Lista: Empresa[] = [];
  SinBusquedasRealizadas = true;
  FormReg: FormGroup;
  submitted = false;

  constructor(
    private empresasService: EmpresasService,
    public formBuilder: FormBuilder,
    private modalDialogService: ModalDialogService
  ) {}

  ngOnInit() {
    this.Buscar()

    this.FormReg = this.formBuilder.group({

      IdEmpresa: [0],
      
      RazonSocial: [null, [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(50)
      ]],

      FechaFundacion: [null, [
        Validators.required,
        Validators.pattern("(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/](19|20)[0-9]{2}")
      ]],

      CantidadEmpleados: [null, [
        Validators.required, 
        Validators.pattern("[0-9]{1,10}")
      ]]
    });
  }

  Agregar() {
    this.AccionABMC = "A";
    this.FormReg.reset(this.FormReg.value);
    this.submitted = false;
    this.FormReg.markAsUntouched();
  }

  Buscar() {
    this.SinBusquedasRealizadas = false;
    this.empresasService
    .get()
    .subscribe((res: Empresa[]) => {
      this.Lista = res;
    });
  }

  BuscarPorId(emp, AccionABMC) {
    window.scroll(0, 0);

    this.empresasService
    .getById(emp.IdEmpresa)
    .subscribe((res: any) => {
      this.FormReg.patchValue(res);

      //formatear fecha de  ISO 8061 a string dd/MM/yyyy
      var arrFecha = res.FechaFundacion.substr(0, 10).split("-");
      this.FormReg.controls.FechaFundacion.patchValue(
        arrFecha[2] + "/" + arrFecha[1] + "/" + arrFecha[0]
      );

      this.AccionABMC = AccionABMC;
    });
  }

  Consultar(emp) {
    this.BuscarPorId(emp, "C");
  }

  Modificar(emp) {
    this.submitted = false;
    this.FormReg.markAsPristine();
    this.FormReg.markAsUntouched();
    this.BuscarPorId(emp, "M");
  }

  Grabar() {
    this.submitted = true;

    // verificar que los validadores esten OK
    if (this.FormReg.invalid) {
      return;
    }

    //hacemos una copia de los datos del formulario, para modificar la fecha y luego enviarlo al servidor
    const itemCopy = { ...this.FormReg.value };
 
    //convertir fecha de string dd/MM/yyyy a ISO para que la entienda webapi
    var arrFecha = itemCopy.FechaFundacion.substr(0, 10).split("/");
    if (arrFecha.length == 3)
      itemCopy.FechaFundacion = 
          new Date(
            arrFecha[2],
            arrFecha[1] - 1,
            arrFecha[0]
          ).toISOString();
 
    // agregar post
    if (itemCopy.IdEmpresa == 0 || itemCopy.IdEmpresa == null) {
      this.empresasService
      .post(itemCopy)
      .subscribe((res: any) => {
        this.Volver();
        this.modalDialogService.Alert('Registro agregado correctamente.');
        this.Buscar();
      });
    } else {
      // modificar put
      this.empresasService
      .put(itemCopy.IdEmpresa, itemCopy)
      .subscribe((res: any) => {
          this.Volver();
          this.modalDialogService.Alert('Registro modificado correctamente.');
          this.Buscar();
        });
    }
  }

  Volver() {
    this.AccionABMC = "L";
  }

  Eliminar(e){
    this.modalDialogService.Confirm(
      "Esta seguro de eliminar esta empresa?",
      undefined,
      undefined,
      undefined,
      () =>
        this.empresasService.delete(e.IdEmpresa).subscribe((res: any) => 
          this.Buscar()), null);
  }
}
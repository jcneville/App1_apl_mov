import { Component } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  tempStr: string = "25";
  temp: number = 25;
  maxTemp: number = 30;
  minTemp: number = 20;

  estadoTemp: number = 0;
  estadoBluetooth: number = 0;

  private timerHandle;
  private listBluetoothDevices; 

  constructor(private myBluetooth: BluetoothSerial, private aAlert: AlertController) { }
  
  async onClickDiscover() {
    this.estadoBluetooth = 1;
    try {
      let respuesta = this.myBluetooth.isEnabled();
      this.listBluetoothDevices = await this.myBluetooth.list();
    } catch (e) {
      this.estadoBluetooth = 0;
      this.presentAlert();
    }
  }

  async presentAlert() {
    const alert = await this.aAlert.create({
      header: 'CONTROL TEMPERATURA',
      message: 'Habilite el BLUETOOTH ',
      buttons: ['OK']
    });
  
    await alert.present();
  }

  onClickConnect(address) {
    this.estadoBluetooth = 0;
    this.myBluetooth.connect(address).subscribe(res => {
      alert("Dispositivo CONECTADO");
      this.estadoBluetooth = 2;
    }, error => {
        alert(error);
    });
  }

  onClickDisconnect() {
    try {
      let respuesta = this.myBluetooth.disconnect();
      alert('Dispositvo DESCONECTADO');
    } catch (e) {
      alert(e);
    }
  }

  async onClickTempOn() {
    if (this.estadoBluetooth != 2)
      return;
    if (this.estadoTemp == 0) {
      this.myBluetooth.write('tOn');
      this.estadoTemp = 1;
      this.timerHandle = setInterval(() => {
        this.myBluetooth.available()
          .then((number: any) => {
            this.myBluetooth.read()
            .then((data: any) => {
              if (data[0] == 't' && data[1] == 'M') {
                this.temp = data[2];
                this.temp += (data[3] * (1 << 8));
                this.temp += (data[4] * (1 << 16));
                this.temp += (data[5] * (1 << 24));
                this.tempStr = this.temp.toFixed(1);
                this.myBluetooth.clear();
              }
            });
        });      }, 1000);
    }
  }

  onClickCambiar() {
    if (this.estadoBluetooth != 2)
      return;
    
    var data = new Uint8Array(12);

    if ((this.minTemp > this.minTemp) || (this.maxTemp < this.minTemp))
      this.minTemp == this.maxTemp;

    data[0] = parseInt('t');
    data[1] = parseInt('0');
    data[2] = this.minTemp & 0x000000FF;
    data[3] = ((this.minTemp & 0x0000FF00) >> 8);
    data[4] = ((this.minTemp & 0x00FF0000) >> 16);
    data[5] = ((this.minTemp & 0xFF000000) >> 24);
    data[6] = parseInt('t');
    data[7] = parseInt('1');
    data[8] = this.maxTemp & 0x000000FF;
    data[9] = ((this.maxTemp & 0x0000FF00) >> 8);
    data[10] = ((this.maxTemp & 0x00FF0000) >> 16);
    data[11] = ((this.maxTemp & 0xFF000000) >> 24);
    this.myBluetooth.write(data);    
  }

}

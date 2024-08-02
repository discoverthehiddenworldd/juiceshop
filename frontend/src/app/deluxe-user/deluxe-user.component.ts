/*
 * Copyright (c) 2014-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { Component, NgZone, type OnInit } from '@angular/core'
import { UserService } from '../Services/user.service'
import { ActivatedRoute, Router } from '@angular/router'
import { CookieService } from 'ngy-cookie'
import { ConfigurationService } from '../Services/configuration.service'
import { SocketIoService } from '../Services/socket-io.service'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { TranslateModule } from '@ngx-translate/core'
import { MatCard } from '@angular/material/card'
import { NgIf } from '@angular/common'
import { FlexModule } from '@angular/flex-layout/flex'

@Component({
  selector: 'app-deluxe-user',
  templateUrl: './deluxe-user.component.html',
  styleUrls: ['./deluxe-user.component.scss'],
  standalone: true,
  imports: [FlexModule, NgIf, MatCard, TranslateModule, MatButton, MatIcon]
})

export class DeluxeUserComponent implements OnInit {
  public membershipCost: number = 0
  public error: string = undefined
  public applicationName = 'OWASP Juice Shop'
  public logoSrc: string = 'assets/public/images/JuiceShop_Logo.png'

  constructor (private readonly router: Router, private readonly userService: UserService, private readonly cookieService: CookieService, private readonly configurationService: ConfigurationService, private readonly route: ActivatedRoute, private readonly ngZone: NgZone, private readonly io: SocketIoService) {
  }

  ngOnInit () {
    this.configurationService.getApplicationConfiguration().subscribe((config) => {
      const decalParam: string = this.route.snapshot.queryParams.testDecal // "Forgotten" test parameter to play with different stickers on the delivery box image
      if (config?.application) {
        if (config.application.name) {
          this.applicationName = config.application.name
        }
        if (config.application.logo) {
          let logo: string = config.application.logo

          if (logo.substring(0, 4) === 'http') {
            logo = decodeURIComponent(logo.substring(logo.lastIndexOf('/') + 1))
          }
          this.logoSrc = `assets/public/images/${decalParam || logo}`
        }
      }
      if (decalParam) {
        this.ngZone.runOutsideAngular(() => {
          this.io.socket().emit('verifySvgInjectionChallenge', decalParam)
        })
      }
    }, (err) => { console.log(err) })
    this.userService.deluxeStatus().subscribe((res) => {
      this.membershipCost = res.membershipCost
    }, (err) => {
      this.error = err.error.error
    })
  }

  upgradeToDeluxe () {
    this.ngZone.run(async () => await this.router.navigate(['/payment', 'deluxe']))
  }
}

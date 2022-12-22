import { options } from './options';

export default class ThemeSettingsController {
  /* @ngInject */
  constructor($async, Authentication, ThemeManager, StateManager, UserService, Notifications) {
    this.$async = $async;
    this.Authentication = Authentication;
    this.ThemeManager = ThemeManager;
    this.StateManager = StateManager;
    this.UserService = UserService;
    this.Notifications = Notifications;

    this.setTheme = this.setTheme.bind(this);
  }

  async setTheme(theme) {
    try {
      if (theme === 'auto' || !theme) {
        this.ThemeManager.autoTheme();
      } else {
        this.ThemeManager.setTheme(theme);
      }

      this.state.userTheme = theme;
      if (!this.state.isDemo) {
        await this.UserService.updateUserTheme(this.state.userId, this.state.userTheme);
      }

      this.Notifications.success('Success', 'User theme successfully updated');
    } catch (err) {
      this.Notifications.error('失败', err, 'Unable to update user theme');
    }
  }

  $onInit() {
    return this.$async(async () => {
      const state = this.StateManager.getState();

      this.state = {
        userId: null,
        userTheme: '',
        defaultTheme: 'auto',
        isDemo: state.application.demoEnvironment.enabled,
      };

      this.state.availableThemes = options;

      try {
        this.state.userId = await this.Authentication.getUserDetails().ID;
        const data = await this.UserService.user(this.state.userId);
        this.state.userTheme = data.UserTheme || this.state.defaultTheme;
      } catch (err) {
        this.Notifications.error('失败', err, 'Unable to get user details');
      }
    });
  }
}

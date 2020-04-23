package com.smotana.clearflask.core.push.message;

import com.google.common.base.Strings;
import com.google.inject.AbstractModule;
import com.google.inject.Inject;
import com.google.inject.Module;
import com.google.inject.Singleton;
import com.kik.config.ice.ConfigSystem;
import com.kik.config.ice.annotations.DefaultValue;
import com.smotana.clearflask.api.model.ConfigAdmin;
import com.smotana.clearflask.core.push.provider.EmailService.Email;
import com.smotana.clearflask.store.UserStore;
import com.smotana.clearflask.store.UserStore.UserModel;
import com.smotana.clearflask.web.Application;
import lombok.extern.slf4j.Slf4j;

import static com.google.common.base.Preconditions.checkArgument;

@Slf4j
@Singleton
public class OnEmailChanged {

    public interface Config {
        @DefaultValue("Your email has been changed")
        String subjectTemplate();

        @DefaultValue("If you did not make a request to change your email on your __project_name__ account, please click the button below and change your email and password immediately.")
        String contentTemplate();
    }

    @Inject
    private Config config;
    @Inject
    private Application.Config configApp;
    @Inject
    private UserStore userStore;
    @Inject
    private EmailNotificationTemplate emailNotificationTemplate;

    public Email email(ConfigAdmin configAdmin, UserModel user, String oldEmail, String link, String authToken) {
        checkArgument(!Strings.isNullOrEmpty(oldEmail));

        String subject = config.subjectTemplate();
        String content = config.contentTemplate();

        String templateHtml = emailNotificationTemplate.getNotificationTemplateHtml();
        String templateText = emailNotificationTemplate.getNotificationTemplateText();

        templateHtml = templateHtml.replaceAll("__CONTENT__", content);
        templateText = templateText.replaceAll("__CONTENT__", content);

        String buttonText = "Account settings";
        templateHtml = templateHtml.replaceAll("__BUTTON_TEXT__", buttonText);
        templateText = templateText.replaceAll("__BUTTON_TEXT__", buttonText);

        link += "?authToken=" + authToken;
        templateHtml = templateHtml.replaceAll("__BUTTON_URL__", link);
        templateText = templateText.replaceAll("__BUTTON_URL__", link);

        String unsubscribeLink = "https://" + configAdmin.getSlug() + "." + configApp.domain() + "/account?authToken=" + authToken;
        templateHtml = templateHtml.replaceAll("__UNSUBSCRIBE_URL__", unsubscribeLink);
        templateText = templateText.replaceAll("__UNSUBSCRIBE_URL__", unsubscribeLink);

        return new Email(
                oldEmail,
                subject,
                templateHtml,
                templateText,
                configAdmin.getProjectId(),
                "FORGOT_PASSWORD"
        );
    }

    public static Module module() {
        return new AbstractModule() {
            @Override
            protected void configure() {
                bind(OnEmailChanged.class).asEagerSingleton();
                install(ConfigSystem.configModule(Config.class));
            }
        };
    }
}
